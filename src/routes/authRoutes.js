const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { PrismaClient } = require('@prisma/client');
const { default: axios } = require('axios');


const prisma = new PrismaClient();

/**
 * Gera token de ativação seguro
 */
const generateActivationToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

/**
 * Calcula data de expiração (24 horas)
 */
const getExpirationDate = () => {
  const date = new Date();
  date.setHours(date.getHours() + 24);
  return date;
};

/**
 * Gera senha temporária segura
 */
const generateTempPassword = () => {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  let password = '';
  for (let i = 0; i < 8; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
};

// Registro por administrador (apenas email)
router.post('/register', async (req, res) => {
  const { email } = req.body;

  // Validações
  if (!email) {
    return res.status(400).json({
      success: false,
      error: 'Email é obrigatório'
    });
  }

  // Validação de email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({
      success: false,
      error: 'Email inválido'
    });
  }

  try {
    // Verifica se email já existe
    const existingUser = await prisma.users.findUnique({
      where: { email: email.toLowerCase() }
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        error: 'Email já está em uso'
      });
    }

    // Gera senha temporária e token de ativação
    const tempPassword = generateTempPassword();
    const password_hash = await bcrypt.hash(tempPassword, 12);
    const activationToken = generateActivationToken();
    const expiresAt = getExpirationDate();

    // Cria usuário com dados temporários
    const user = await prisma.users.create({
      data: {
        name: "Agente_" + crypto.randomUUID().slice(0, 8), // Nome temporário
        email: email.toLowerCase(),
        password_hash,
        role: 'user',
        is_active: true,
        activation_token: {
          create: {
            token: activationToken,
            expires_at: expiresAt,
            is_first_activation: true,
            temp_password: tempPassword
          }
        }
      },
      include: {
        activation_token: true
      }
    });

    // Envia email com senha temporária e link de ativação
    try {

      const data = {
        subject: 'Criação de Conta - Ação Necessária',
        user_name: user.name,
        user_email: user.email,
        user_role: "pendent-user",
        activation_link: `http://localhost:3000/activate-account?token=${activationToken}`,
        user_password: tempPassword,
        expiry_time: expiresAt,
      };
      const response = await axios.post(process.env.APPS_EMAIL_SERVICE, data, {
        headers: {
          'Content-Type': 'application/json',
        }
      });

      console.log('Resposta do serviço de email:', response.data);

      res.status(201).json({
        success: true,
        email: user.email,
        id: user.id,
        name: user.name,
        message: 'Usuário registrado com sucesso. Email de ativação enviado com senha temporária.',
        user_role: user.role,
        expiry_time: expiresAt,
      });

    } catch (emailError) {
      console.error('Erro ao enviar email:', emailError);

      // Remove o usuário se falhou ao enviar email
      await prisma.users.delete({ where: { id: user.id } });

      res.status(500).json({
        success: false,
        error: 'Erro ao enviar email de ativação. Tente novamente.'
      });
    }

  } catch (error) {
    console.error('Erro no registro:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

// Ativação de conta
router.post('/activate', async (req, res) => {
  const { token, name, password } = req.body;

  if (!token) {
    return res.status(400).json({
      success: false,
      error: 'Token de ativação é obrigatório'
    });
  }

  try {
    // Busca o token de ativação
    const activationToken = await prisma.account_activation_tokens.findUnique({
      where: { token },
      include: { user: true }
    });

    if (!activationToken) {
      return res.status(400).json({
        success: false,
        error: 'Token de ativação inválido'
      });
    }

    // Verifica se o token já foi usado
    if (activationToken.used) {
      return res.status(400).json({
        success: false,
        error: 'Este token já foi utilizado'
      });
    }

    // Verifica se o token expirou
    if (new Date() > activationToken.expires_at) {
      return res.status(400).json({
        success: false,
        error: 'Token de ativação expirado'
      });
    }

    // Se é primeira ativação, requer dados adicionais
    if (activationToken.is_first_activation) {
      if (!name || !password) {
        return res.status(400).json({
          success: false,
          error: 'Para primeira ativação: nome, nova senha e senha temporária são obrigatórios',
          requires_first_activation: true
        });
      }

      // Valida nova senha
      if (password.length < 6) {
        return res.status(400).json({
          success: false,
          error: 'Nova senha deve ter pelo menos 6 caracteres'
        });
      }

      // Valida nome
      if (name.trim().length < 2) {
        return res.status(400).json({
          success: false,
          error: 'Nome deve ter pelo menos 2 caracteres'
        });
      }

      // Ativa a conta com novos dados
      const newPasswordHash = await bcrypt.hash(password, 12);

      await prisma.$transaction(async (tx) => {
        // Atualiza o usuário
        await tx.users.update({
          where: { id: activationToken.user_id },
          data: {
            is_active: true,
            name: name.trim(),
            password_hash: newPasswordHash
          }
        });

        // Marca o token como usado
        await tx.account_activation_tokens.update({
          where: { id: activationToken.id },
          data: { used: true }
        });
      });

      // Envia email de boas-vindas
      try {
        const data = {
          subject: "Ativação de Conta Bem-Sucedida",
          user_name: name.trim(),
          user_email: activationToken.user.email,
          login_url: 'http://localhost:3000/login'
        };

        const response = await axios.post(process.env.APPS_EMAIL_SERVICE, data, {
          headers: {
            'Content-Type': 'application/json',
          }
        });
        console.log("Resposta do serviço de email:", response.data);

      } catch (emailError) {
        console.log('Aviso: Falha ao enviar email de boas-vindas:', emailError.message);
      }

      res.json({
        success: true,
        message: 'Conta ativada com sucesso! Você já pode fazer login com seus novos dados.',
        data: {
          user: {
            id: activationToken.user.id,
            name: name.trim(),
            email: activationToken.user.email,
            is_active: true
          }
        }
      });

    } else {
      // Ativação simples (para contas que já foram ativadas antes)
      await prisma.$transaction(async (tx) => {
        // Ativa o usuário
        await tx.users.update({
          where: { id: activationToken.user_id },
          data: { is_active: true }
        });

        // Marca o token como usado
        await tx.account_activation_tokens.update({
          where: { id: activationToken.id },
          data: { used: true }
        });
      });

      res.json({
        success: true,
        message: 'Conta ativada com sucesso! Você já pode fazer login.',
        data: {
          user: {
            id: activationToken.user.id,
            name: activationToken.user.name,
            email: activationToken.user.email,
            is_active: true
          }
        }
      });
    }

  } catch (error) {
    console.error('Erro na ativação:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

// Reenvio de email de ativação
router.post('/resend-activation', async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({
      success: false,
      error: 'Email é obrigatório'
    });
  }

  try {
    // Busca o usuário
    const user = await prisma.users.findUnique({
      where: { email: email.toLowerCase() },
      include: { activation_token: true }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Usuário não encontrado'
      });
    }

    if (user.is_active) {
      return res.status(400).json({
        success: false,
        error: 'Esta conta já está ativada'
      });
    }

    // Gera novo token se não existe ou se o atual expirou
    let shouldCreateNewToken = true;

    if (user.activation_token && !user.activation_token.used) {
      // Se o token atual ainda é válido (não expirou), não cria novo
      if (new Date() < user.activation_token.expires_at) {
        shouldCreateNewToken = false;
      }
    }

    let tokenToUse = user.activation_token?.token;

    if (shouldCreateNewToken) {
      const newToken = generateActivationToken();
      const newExpiresAt = getExpirationDate();

      // Atualiza ou cria novo token
      await prisma.account_activation_tokens.upsert({
        where: { user_id: user.id },
        create: {
          user_id: user.id,
          token: newToken,
          expires_at: newExpiresAt
        },
        update: {
          token: newToken,
          expires_at: newExpiresAt,
          used: false
        }
      });

      tokenToUse = newToken;
    }

    // Reenvia o email
    await emailService.sendActivationEmail(user.email, user.name, tokenToUse);

    res.json({
      success: true,
      message: 'Email de ativação reenviado com sucesso. Verifique sua caixa de entrada.'
    });

  } catch (error) {
    console.error('Erro ao reenviar ativação:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

// Login (modificado para verificar ativação)
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      success: false,
      error: 'Email e senha são obrigatórios'
    });
  }

  try {
    const user = await prisma.users.findUnique({
      where: { email: email.toLowerCase() }
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Email ou senha inválidos'
      });
    }

    // Verifica se a conta está ativa
    if (!user.is_active) {
      return res.status(403).json({
        success: false,
        error: 'Conta não ativada. Verifique seu email ou solicite um novo link de ativação.',
        code: 'ACCOUNT_NOT_ACTIVATED'
      });
    }

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({
        success: false,
        error: 'Email ou senha inválidos'
      });
    }

    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role || 'user'
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      message: 'Login realizado com sucesso',
      data: {
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role || 'user',
          is_active: user.is_active
        }
      }
    });

  } catch (error) {
    console.error('Erro no login:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

// Verificar status do token de ativação
router.get('/activation-status/:token', async (req, res) => {
  const { token } = req.params;

  if (!token) {
    return res.status(400).json({
      success: false,
      error: 'Token é obrigatório'
    });
  }

  try {
    const activationToken = await prisma.account_activation_tokens.findUnique({
      where: { token },
      include: { user: true }
    });

    if (!activationToken) {
      return res.json({
        success: false,
        status: 'invalid',
        message: 'Token inválido'
      });
    }

    if (activationToken.used) {
      return res.json({
        success: true,
        status: 'already_used',
        message: 'Token já foi utilizado',
        user: {
          name: activationToken.user.name,
          email: activationToken.user.email,
          is_active: activationToken.user.is_active
        }
      });
    }

    if (new Date() > activationToken.expires_at) {
      return res.json({
        success: false,
        status: 'expired',
        message: 'Token expirado',
        user: {
          name: activationToken.user.name,
          email: activationToken.user.email
        }
      });
    }

    res.json({
      success: true,
      status: 'valid',
      message: 'Token válido e pronto para ativação',
      user: {
        name: activationToken.user.name,
        email: activationToken.user.email
      },
      expires_at: activationToken.expires_at,
      is_first_activation: activationToken.is_first_activation,
      requires_name_and_password: activationToken.is_first_activation
    });

  } catch (error) {
    console.error('Erro ao verificar token:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

module.exports = router;

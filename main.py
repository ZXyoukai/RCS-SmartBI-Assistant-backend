"""
SmartBI Assistant - Análise de Dados com Google Gemini
=====================================================

Sistema de análise de dados que utiliza a API do Google Gemini para gerar 
insights estratégicos de negócios a partir de bases de dados ou arquivos CSV.

Autor: SmartBI Team
Versão: 2.0.0
Data: 2025
"""

from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import os
import logging
from pathlib import Path
from dotenv import load_dotenv

# Importações dos módulos locais
from gemini_analyzer import GeminiAnalyzer
from data_processor import DataProcessor

# Carrega variáveis de ambiente
load_dotenv()

# Configuração de logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Inicializa a aplicação FastAPI
app = FastAPI(
    title="SmartBI Assistant",
    description="Sistema de análise de dados com Google Gemini para insights estratégicos de negócios",
    version="2.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Configuração CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Em produção, especifique domínios específicos
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Diretório para arquivos temporários
TEMP_DIR = Path("temp")
TEMP_DIR.mkdir(exist_ok=True)

# Inicializar serviços
try:
    gemini_analyzer = GeminiAnalyzer()
    data_processor = DataProcessor()
    logger.info("✅ Serviços inicializados com sucesso")
except Exception as e:
    logger.error(f"❌ Erro ao inicializar serviços: {e}")
    raise


@app.get("/")
async def root():
    """
    Endpoint raiz com informações da API
    """
    return {
        "name": "SmartBI Assistant",
        "version": "2.0.0",
        "description": "Análise de dados com Google Gemini",
        "status": "online",
        "endpoints": {
            "/": "GET - Informações da API",
            "/upload": "POST - Upload de arquivo para análise",
            "/health": "GET - Status de saúde da aplicação",
            "/docs": "GET - Documentação interativa (Swagger)",
            "/redoc": "GET - Documentação alternativa (ReDoc)"
        },
        "supported_formats": ["CSV", "SQL"],
        "ai_provider": "Google Gemini",
        "documentation": "/docs"
    }


@app.get("/health")
async def health_check():
    """
    Endpoint de verificação de saúde da aplicação
    """
    try:
        # Verifica se o Gemini está configurado
        gemini_status = gemini_analyzer.check_connection()
        
        return {
            "status": "healthy" if gemini_status else "warning",
            "services": {
                "api": "online",
                "gemini": "configured" if gemini_status else "not_configured",
                "temp_directory": "available" if TEMP_DIR.exists() else "unavailable"
            },
            "message": "Aplicação funcionando normalmente" if gemini_status else "Gemini API não configurada"
        }
    except Exception as e:
        logger.error(f"Erro no health check: {e}")
        return {
            "status": "error",
            "services": {
                "api": "online",
                "gemini": "error",
                "temp_directory": "unknown"
            },
            "error": str(e)
        }


@app.post("/upload")
async def upload_and_analyze(file: UploadFile = File(...)):
    """
    Endpoint para upload de arquivo e análise com Gemini
    
    Args:
        file: Arquivo CSV ou SQL via multipart/form-data
    
    Returns:
        JSON com análise completa dos dados usando Gemini
    """
    
    # Log do início da requisição
    logger.info(f"📤 Upload iniciado: {file.filename}")
    
    try:
        # 1. Validações iniciais
        if not file.filename:
            raise HTTPException(status_code=400, detail="Nome do arquivo é obrigatório")
        
        if file.size and file.size > 50 * 1024 * 1024:  # 50MB
            raise HTTPException(status_code=413, detail="Arquivo muito grande (máximo 50MB)")
        
        file_extension = Path(file.filename).suffix.lower()
        if file_extension not in ['.csv', '.sql']:
            raise HTTPException(
                status_code=400, 
                detail=f"Formato de arquivo não suportado: {file_extension}. Use .csv ou .sql"
            )
        
        # 2. Salva arquivo temporariamente
        temp_file_path = TEMP_DIR / file.filename
        
        try:
            with open(temp_file_path, "wb") as buffer:
                content = await file.read()
                buffer.write(content)
            
            logger.info(f"📁 Arquivo salvo: {temp_file_path} ({len(content)} bytes)")
            
        except Exception as e:
            logger.error(f"Erro ao salvar arquivo: {e}")
            raise HTTPException(status_code=500, detail="Erro ao salvar arquivo")
        
        # 3. Processa os dados
        try:
            processed_data = data_processor.process_file(temp_file_path)
            logger.info(f"📊 Dados processados: {processed_data['info']}")
            
        except Exception as e:
            logger.error(f"Erro ao processar dados: {e}")
            raise HTTPException(status_code=400, detail=f"Erro ao processar dados: {str(e)}")
        
        # 4. Análise com Gemini
        try:
            gemini_analysis = await gemini_analyzer.analyze_data(
                data_content=processed_data['content'],
                data_info=processed_data['info'],
                file_type=file_extension[1:]  # Remove o ponto da extensão
            )
            logger.info("🤖 Análise Gemini concluída")
            
        except Exception as e:
            logger.error(f"Erro na análise Gemini: {e}")
            raise HTTPException(status_code=500, detail=f"Erro na análise com IA: {str(e)}")
        
        # 5. Preparar resposta
        response = {
            "success": True,
            "message": "Análise concluída com sucesso",
            "file_info": {
                "filename": file.filename,
                "size": len(content),
                "type": file_extension[1:],
                "processed_at": processed_data['info'].get('processed_at')
            },
            "data_summary": processed_data['info'],
            "gemini_response": gemini_analysis['gemini_response'],
            "processing_time": gemini_analysis.get('processing_time', 0),
            "model_used": gemini_analysis.get('model_used', 'gemini-2.5-flash-lite'),
            "analyzed_at": gemini_analysis.get('analyzed_at')
        }
        
        logger.info(f"✅ Análise concluída para: {file.filename}")
        return JSONResponse(content=response)
        
    except HTTPException:
        # Re-levanta HTTPExceptions (erros de validação)
        raise
        
    except Exception as e:
        logger.error(f"❌ Erro inesperado: {e}")
        raise HTTPException(status_code=500, detail="Erro interno do servidor")
        
    finally:
        # 6. Limpeza: remove arquivo temporário
        try:
            if temp_file_path.exists():
                temp_file_path.unlink()
                logger.info(f"🗑️ Arquivo temporário removido: {temp_file_path}")
        except Exception as e:
            logger.warning(f"Aviso: Erro ao remover arquivo temporário: {e}")


@app.exception_handler(404)
async def not_found_handler(request, exc):
    """Handler personalizado para 404"""
    return JSONResponse(
        status_code=404,
        content={
            "error": "Endpoint não encontrado",
            "message": "Verifique a URL e tente novamente",
            "available_endpoints": ["/", "/upload", "/health", "/docs"]
        }
    )


@app.exception_handler(500)
async def internal_error_handler(request, exc):
    """Handler personalizado para erros 500"""
    logger.error(f"Erro interno do servidor: {exc}")
    return JSONResponse(
        status_code=500,
        content={
            "error": "Erro interno do servidor",
            "message": "Algo deu errado. Tente novamente ou entre em contato com o suporte."
        }
    )


def main():
    """
    Função principal para inicializar o servidor
    """
    port = int(os.getenv("PORT", 8000))
    host = os.getenv("HOST", "0.0.0.0")
    environment = os.getenv("ENVIRONMENT", "development")
    
    logger.info(f"🚀 Iniciando SmartBI Assistant v2.0.0")
    logger.info(f"🌐 Servidor: http://{host}:{port}")
    logger.info(f"📚 Documentação: http://{host}:{port}/docs")
    logger.info(f"🔧 Ambiente: {environment}")
    
    # Configurações para desenvolvimento vs produção
    if environment == "development":
        uvicorn.run(
            "main:app",
            host=host,
            port=port,
            reload=True,
            log_level="info"
        )
    else:
        uvicorn.run(
            app,
            host=host,
            port=port,
            log_level="warning"
        )


if __name__ == "__main__":
    main()

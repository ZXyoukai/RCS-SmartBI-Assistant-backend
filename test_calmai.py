#!/usr/bin/env python3
"""
Script de teste direto para o arquivo calmai.sql
"""

import sqlite3
import pandas as pd
import re

def process_calmai_sql():
    print("🔍 Iniciando processamento do calmai.sql...")
    
    # Lê o arquivo
    with open('calmai (1).sql', 'r', encoding='utf-8') as f:
        content = f.read()
    
    print(f"📄 Arquivo lido: {len(content)} caracteres")
    
    # Remove comandos problemáticos do phpMyAdmin
    print("🧹 Removendo comandos phpMyAdmin...")
    
    # Remove apenas linhas específicas problemáticas
    lines = content.split('\n')
    filtered_lines = []
    
    for line in lines:
        line_stripped = line.strip()
        # Pula linhas de comentário e comandos específicos
        if (line_stripped.startswith('--') or 
            line_stripped.startswith('/*') or
            line_stripped.startswith('SET ') or
            line_stripped.startswith('START TRANSACTION') or
            line_stripped.startswith('COMMIT') or
            line_stripped.startswith('/*!') or
            not line_stripped):
            continue
        filtered_lines.append(line)
    
    content = '\n'.join(filtered_lines)
    
    # Separa statements
    statements = [s.strip() for s in content.split(';') if s.strip()]
    print(f"📊 Total statements: {len(statements)}")
    
    # Filtra apenas CREATE TABLE e INSERT
    create_tables = []
    inserts = []
    
    for stmt in statements:
        stmt_upper = stmt.upper().strip()
        if stmt_upper.startswith('CREATE TABLE'):
            # Simplifica o CREATE TABLE
            simplified = simplify_create_table(stmt)
            if simplified:
                create_tables.append(simplified)
        elif stmt_upper.startswith('INSERT INTO'):
            inserts.append(stmt)
    
    print(f"📋 CREATE TABLEs encontrados: {len(create_tables)}")
    print(f"📋 INSERTs encontrados: {len(inserts)}")
    
    # Conecta ao SQLite
    conn = sqlite3.connect(':memory:')
    
    # Executa CREATE TABLEs
    table_names = []
    for i, create_stmt in enumerate(create_tables):
        try:
            conn.execute(create_stmt)
            # Extrai nome da tabela
            match = re.search(r'CREATE\s+TABLE\s+`?(\w+)`?', create_stmt, re.IGNORECASE)
            if match:
                table_names.append(match.group(1))
                print(f"✅ Tabela criada: {match.group(1)}")
        except Exception as e:
            print(f"❌ Erro ao criar tabela {i+1}: {e}")
    
    # Executa INSERTs
    successful_inserts = 0
    for insert_stmt in inserts:
        try:
            conn.execute(insert_stmt)
            successful_inserts += 1
        except Exception as e:
            # Ignora erros de INSERT silenciosamente
            pass
    
    print(f"📥 INSERTs bem-sucedidos: {successful_inserts}/{len(inserts)}")
    conn.commit()
    
    # Lista tabelas com dados
    cursor = conn.cursor()
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
    final_tables = [row[0] for row in cursor.fetchall()]
    
    print(f"🗂️ Tabelas finais: {final_tables}")
    
    # Encontra tabela com mais dados
    best_table = None
    max_rows = 0
    
    for table in final_tables:
        try:
            count = conn.execute(f"SELECT COUNT(*) FROM `{table}`").fetchone()[0]
            print(f"📊 {table}: {count} linhas")
            if count > max_rows:
                max_rows = count
                best_table = table
        except:
            pass
    
    if best_table and max_rows > 0:
        print(f"🎯 Melhor tabela: {best_table} ({max_rows} linhas)")
        df = pd.read_sql_query(f"SELECT * FROM `{best_table}`", conn)
        print(f"✅ Dataset carregado: {df.shape}")
        print("Colunas:", list(df.columns))
        if len(df) > 0:
            print("Primeira linha:")
            print(df.iloc[0].to_dict())
        return df
    else:
        print("❌ Nenhuma tabela com dados encontrada")
        return None

def simplify_create_table(stmt):
    """Simplifica um CREATE TABLE para SQLite"""
    try:
        # Remove backticks
        stmt = stmt.replace('`', '')
        
        # Converte tipos MySQL para SQLite
        stmt = re.sub(r'\bchar\([^)]+\)', 'TEXT', stmt, flags=re.IGNORECASE)
        stmt = re.sub(r'\bvarchar\([^)]+\)', 'TEXT', stmt, flags=re.IGNORECASE)
        stmt = re.sub(r'\blongtext\b', 'TEXT', stmt, flags=re.IGNORECASE)
        stmt = re.sub(r'\btext\b', 'TEXT', stmt, flags=re.IGNORECASE)
        stmt = re.sub(r'\bbigint\([^)]+\)', 'INTEGER', stmt, flags=re.IGNORECASE)
        stmt = re.sub(r'\bint\([^)]+\)', 'INTEGER', stmt, flags=re.IGNORECASE)
        stmt = re.sub(r'\btinyint\([^)]+\)', 'INTEGER', stmt, flags=re.IGNORECASE)
        stmt = re.sub(r'\bdouble\([^)]+\)', 'REAL', stmt, flags=re.IGNORECASE)
        stmt = re.sub(r'\bdouble\b', 'REAL', stmt, flags=re.IGNORECASE)
        stmt = re.sub(r'\btimestamp\b', 'TEXT', stmt, flags=re.IGNORECASE)
        stmt = re.sub(r'\bdate\b', 'TEXT', stmt, flags=re.IGNORECASE)
        stmt = re.sub(r'\btime\b', 'TEXT', stmt, flags=re.IGNORECASE)
        stmt = re.sub(r'\benum\([^)]+\)', 'TEXT', stmt, flags=re.IGNORECASE)
        
        # Remove constraints não suportados
        stmt = re.sub(r'\s+UNSIGNED', '', stmt, flags=re.IGNORECASE)
        stmt = re.sub(r'\s+AUTO_INCREMENT', '', stmt, flags=re.IGNORECASE)
        
        # Remove ENGINE, CHARSET, etc.
        stmt = re.sub(r'\)\s+ENGINE[^;]*', ')', stmt, flags=re.IGNORECASE)
        
        # Remove KEY definitions
        lines = stmt.split('\n')
        filtered_lines = []
        for line in lines:
            line_upper = line.strip().upper()
            if not (line_upper.startswith('KEY ') or 
                   line_upper.startswith('UNIQUE KEY ') or
                   line_upper.startswith('CONSTRAINT ')):
                filtered_lines.append(line)
        
        result = '\n'.join(filtered_lines)
        return result
        
    except Exception as e:
        print(f"⚠️ Erro ao simplificar CREATE TABLE: {e}")
        return None

if __name__ == "__main__":
    process_calmai_sql()
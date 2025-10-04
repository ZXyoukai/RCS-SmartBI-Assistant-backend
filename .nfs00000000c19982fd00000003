from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
import uvicorn
import os
import shutil
from pathlib import Path
from ml_pipeline import MLPipeline
from analysis import AnalysisGenerator

# Inicializa a aplicação FastAPI
app = FastAPI(
    title="ML Pipeline API",
    description="API para upload de dados e execução de pipeline de Machine Learning",
    version="1.0.0"
)

# Monta a pasta outputs como arquivos estáticos
app.mount("/outputs", StaticFiles(directory="outputs"), name="outputs")

# Diretório para arquivos temporários
TEMP_DIR = Path("temp")
TEMP_DIR.mkdir(exist_ok=True)

@app.get("/")
async def root():
    """Endpoint raiz com informações da API"""
    return {
        "message": "ML Pipeline API",
        "version": "1.0.0",
        "endpoints": {
            "/upload": "POST - Upload de arquivo CSV ou SQL para análise ML",
            "/outputs": "GET - Acesso aos gráficos gerados",
            "/docs": "GET - Documentação interativa da API"
        }
    }

@app.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    """
    Endpoint para upload de arquivo CSV ou SQL e execução do pipeline ML
    
    Args:
        file: Arquivo CSV ou SQL (dump) via multipart/form-data
    
    Returns:
        JSON com resultados da análise, métricas dos modelos e insights
    """
    
    # Valida o arquivo
    if not file.filename:
        raise HTTPException(status_code=400, detail="Nome do arquivo não fornecido")
    
    # Determina o tipo do arquivo
    file_extension = Path(file.filename).suffix.lower()
    
    if file_extension == '.csv':
        file_type = 'csv'
    elif file_extension in ['.sql', '.dump']:
        file_type = 'sql'
    else:
        raise HTTPException(
            status_code=400, 
            detail=f"Tipo de arquivo não suportado: {file_extension}. Use .csv ou .sql"
        )
    
    # Salva o arquivo temporariamente
    temp_file_path = TEMP_DIR / file.filename
    
    try:
        # Salva o arquivo
        with open(temp_file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        # Executa o pipeline ML
        pipeline = MLPipeline()
        results = pipeline.run_pipeline(str(temp_file_path), file_type)
        
        # Gera análise automática
        analyzer = AnalysisGenerator()
        analysis = analyzer.generate_full_analysis(results)
        
        # Combina resultados
        response = {
            "file_info": {
                "filename": file.filename,
                "file_type": file_type,
                "size_bytes": file.size
            },
            "pipeline_results": results,
            "analysis": analysis
        }
        
        return JSONResponse(content=response)
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao processar arquivo: {str(e)}")
    
    finally:
        # Remove o arquivo temporário
        if temp_file_path.exists():
            temp_file_path.unlink()

@app.get("/health")
async def health_check():
    """Endpoint para verificação de saúde da API"""
    return {
        "status": "healthy",
        "temp_dir_exists": TEMP_DIR.exists(),
        "outputs_dir_exists": Path("outputs").exists()
    }

if __name__ == "__main__":
    print("🚀 Iniciando ML Pipeline API...")
    print("📊 Endpoints disponíveis:")
    print("   - POST /upload: Upload de arquivo CSV/SQL")
    print("   - GET /outputs: Acesso aos gráficos")
    print("   - GET /docs: Documentação interativa")
    print("   - GET /health: Status da API")
    print("\n🌐 Acesse: http://localhost:8000/docs")
    
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True
    )

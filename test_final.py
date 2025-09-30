#!/usr/bin/env python3
"""
Teste final do calmai.sql com pipeline ML completo
"""

import sys
import os
sys.path.append('.')

from ml_pipeline import MLPipeline
from analysis import AnalysisGenerator

def test_calmai_complete():
    print("🚀 Testando pipeline ML completo com calmai.sql")
    
    try:
        # 1. Inicializa pipeline
        pipeline = MLPipeline()
        
        # 2. Executa processamento
        print("📊 Executando pipeline...")
        result = pipeline.run_pipeline('calmai (1).sql', 'sql')
        
        if not result['success']:
            print(f"❌ Pipeline falhou: {result['error']}")
            return
        
        # 3. Mostra resultados do pipeline
        data_info = result['data_info']
        print(f"✅ Pipeline executado com sucesso!")
        print(f"📋 Dataset: {data_info['rows']} linhas, {data_info['columns']} colunas")
        print(f"🎯 Features: {data_info['features']}, Classes: {data_info['target_classes']}")
        
        # 4. Mostra resultados dos modelos
        print("\n🤖 Resultados dos Modelos:")
        for model_name, metrics in result['results'].items():
            if 'error' not in metrics:
                problem_type = metrics.get('problem_type', 'classification')
                print(f"  {model_name} ({problem_type}):")
                
                if problem_type == 'classification':
                    print(f"    Accuracy: {metrics.get('accuracy', 0):.3f}")
                    print(f"    F1-score: {metrics.get('f1', 0):.3f}")
                    roc_auc = metrics.get('roc_auc')
                    print(f"    ROC-AUC: {roc_auc:.3f}" if roc_auc is not None else "    ROC-AUC: None")
                else:  # regression
                    print(f"    R² Score: {metrics.get('r2_score', 0):.3f}")
                    print(f"    RMSE: {metrics.get('rmse', 0):.3f}")
                    print(f"    MAE: {metrics.get('mae', 0):.3f}")
                    print(f"    MSE: {metrics.get('mse', 0):.3f}")
        
        # 5. Gera análise automática
        print("\n🧠 Gerando análise automática...")
        analyzer = AnalysisGenerator()
        analysis = analyzer.generate_full_analysis(result)
        
        if analysis['success']:
            print("📈 Resumo Executivo:")
            for summary in analysis['executive_summary']:
                print(f"  • {summary}")
                
            print("\n💡 Insights dos Modelos:")
            for model, insight in analysis['model_insights'].items():
                print(f"  {model}: {insight}")
                
            print(f"\n🏆 Comparação: {analysis['comparison']}")
            
            print("\n🔧 Recomendações:")
            for rec in analysis['recommendations'][:3]:  # Primeiras 3
                print(f"  • {rec}")
        
        # 6. Lista gráficos gerados
        if 'plots' in result and result['plots']:
            print(f"\n📊 Gráficos gerados: {len(result['plots'])} arquivos")
            for plot in result['plots']:
                print(f"  📈 {plot}")
        
        print(f"\n🎯 Teste concluído! Timestamp: {result['timestamp']}")
        
    except Exception as e:
        import traceback
        print(f"💥 Erro durante o teste: {e}")
        traceback.print_exc()

if __name__ == "__main__":
    test_calmai_complete()
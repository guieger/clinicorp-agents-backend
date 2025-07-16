import * as fs from 'fs';
import * as path from 'path';

interface ConfigManager {
  get(key: string): string;
  getNumber(key: string): number;
  getBoolean(key: string): boolean;
  getAll(): Record<string, any>;
  has(key: string): boolean;
}

class EnvironmentConfig implements ConfigManager {
  private configs: Map<string, any> = new Map();
  private jsonDir: string;
  private isLoaded: boolean = false;

  constructor() {
    this.jsonDir = path.join(__dirname, 'json');
    this.loadAllConfigs();
  }

  private loadAllConfigs(): void {
    if (this.isLoaded) return;
    
    try {
      const files = fs.readdirSync(this.jsonDir);
      
      for (const file of files) {
        if (file.endsWith('.json')) {
          const configName = path.basename(file, '.json');
          const filePath = path.join(this.jsonDir, file);
          const configData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
          
          // Armazena apenas uma vez, priorizando chaves sem prefixo
          Object.keys(configData).forEach(key => {
            const value = configData[key];
            
            // Se a chave já existe, não sobrescreve (prioriza a primeira ocorrência)
            if (!this.configs.has(key)) {
              this.configs.set(key, value);
            }
            
            // Adiciona versão com prefixo apenas se não existir
            const prefixedKey = `${configName.toUpperCase()}_${key}`;
            if (!this.configs.has(prefixedKey)) {
              this.configs.set(prefixedKey, value);
            }
          });
        }
      }
      
      this.isLoaded = true;
    } catch (error) {
      console.error('Erro ao carregar configurações:', error);
    }
  }

  has(key: string): boolean {
    return this.configs.has(key);
  }

  get(key: string): string {
    const value = this.configs.get(key);
    if (value === undefined) {
      throw new Error(`Configuração não encontrada: ${key}`);
    }
    // Evita conversão desnecessária se já for string
    return typeof value === 'string' ? value : String(value);
  }

  getNumber(key: string): number {
    const value = this.configs.get(key);
    if (value === undefined) {
      throw new Error(`Configuração não encontrada: ${key}`);
    }
    
    // Se já é número, retorna diretamente
    if (typeof value === 'number') {
      return value;
    }
    
    const num = Number(value);
    if (isNaN(num)) {
      throw new Error(`Configuração ${key} não é um número válido`);
    }
    return num;
  }

  getBoolean(key: string): boolean {
    const value = this.configs.get(key);
    if (value === undefined) {
      throw new Error(`Configuração não encontrada: ${key}`);
    }
    
    // Se já é boolean, retorna diretamente
    if (typeof value === 'boolean') {
      return value;
    }
    
    return String(value).toLowerCase() === 'true';
  }

  getAll(): Record<string, any> {
    const result: Record<string, any> = {};
    this.configs.forEach((value, key) => {
      result[key] = value;
    });
    return result;
  }

  // Método para recarregar configurações (útil para desenvolvimento)
  reload(): void {
    this.configs.clear();
    this.isLoaded = false;
    this.loadAllConfigs();
  }

  // Método para obter estatísticas de performance
  getStats(): { totalConfigs: number; filesLoaded: number } {
    const files = fs.readdirSync(this.jsonDir).filter(f => f.endsWith('.json'));
    return {
      totalConfigs: this.configs.size,
      filesLoaded: files.length
    };
  }
}

// Instância singleton
const config = new EnvironmentConfig();

export default config;

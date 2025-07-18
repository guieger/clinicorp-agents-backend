import { NextFunction, Request, Response } from "express"
import { AccountService } from "../services/accountService"

export interface AuthenticatedRequest extends Request {
  accountId: string;
}

export const authMiddleware = async (req: Request, res: Response, next: NextFunction) => {
    try {
        // Verifica accountId em múltiplas fontes
        let accountId = req.params.accountId || 
                       req.query.accountId || 
                       req.headers['x-account-id'] || 
                       req.headers['account-id'] ||
                       (req.body && req.body.accountId);

        // Se não encontrou em nenhuma fonte, retorna erro
        if (!accountId) {
            return res.status(401).json({ 
                message: 'Account ID é obrigatório. Forneça via: params, query, headers (x-account-id/account-id) ou body', 
                success: false 
            });
        }

        // Converte para string se necessário
        if (typeof accountId !== 'string') {
            accountId = String(accountId);
        }

        // Verifica se a account existe e está ativa na base de dados
        const account = await AccountService.verifyAccountExists(accountId);
        
        if (!account) {
            return res.status(401).json({ 
                message: 'Account não encontrada ou inativa', 
                success: false 
            });
        }

        // Adiciona o accountId e a account à requisição para uso posterior
        (req as AuthenticatedRequest).accountId = accountId;

        next();
    } catch (error) {
        console.error('Erro no middleware de autenticação:', error);
        return res.status(500).json({ 
            message: 'Erro interno do servidor durante autenticação', 
            success: false 
        });
    }
}

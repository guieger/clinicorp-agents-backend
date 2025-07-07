import { Request, Response, NextFunction } from 'express';
import { MESSAGE_VALIDATION_FIELDS } from '../config/validationConfig';
import { validatePayload } from '../utils/validationUtils';

export interface AuthenticatedRequest extends Request {
  accountId: string;
  body: any;
}

export const clientMiddleware = (req: Request, res: Response, next: NextFunction) => {
  // Validação centralizada dos campos obrigatórios
  const { isValid, errors } = validatePayload(req.body, MESSAGE_VALIDATION_FIELDS);
  if (!isValid) {
    return res.status(400).json({ message: errors.join(', ') });
  }

  // Definir e validar accountId
  (req as AuthenticatedRequest).accountId = 'a1a473db-55cc-11f0-aa9d-7ac2abadd37a';
  if (!(req as AuthenticatedRequest).accountId || typeof (req as AuthenticatedRequest).accountId !== 'string') {
    return res.status(401).json({ message: 'Account ID inválido' });
  }

  next();
}; 
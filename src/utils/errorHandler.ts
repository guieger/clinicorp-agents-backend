import { BusinessError } from './errors';

export function handleError(error: any, res: any, defaultMessage: string, req: any) {
  if (error instanceof BusinessError) {
    return res.status(error.statusCode).json({
      error: error.message
    });
  }
  
  console.error('🔥 Unexpected error:', error);

  return res.status(500).json({
    error: defaultMessage
  });
}

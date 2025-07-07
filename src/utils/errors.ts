export class BusinessError extends Error {
    public statusCode: number;

    constructor(message: string, statusCode: number) {
      super(message);
      this.name = 'BusinessError';
      this.statusCode = statusCode;
    }
  }
  
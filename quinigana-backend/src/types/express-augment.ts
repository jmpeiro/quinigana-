export {};

declare global {
  namespace Express {
    interface Request {
      requestId?: string;
      authUser?: {
        userId: number;
        email: string;
        provider: string;
      };
    }
  }
}

export class AppError extends Error { constructor(message: string, public code: string = 'APP_ERROR') { super(message); } }

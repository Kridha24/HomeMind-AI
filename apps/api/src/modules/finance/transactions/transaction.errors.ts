export class TransactionNotFoundError extends Error {
  constructor(id: string) {
    super(`Transaction with ID "${id}" was not found.`);
    this.name = 'TransactionNotFoundError';
  }
}

export class UnauthorizedTransactionAccessError extends Error {
  constructor(message: string = 'You do not have permission to access or modify this transaction.') {
    super(message);
    this.name = 'UnauthorizedTransactionAccessError';
  }
}

export class DuplicateTransactionError extends Error {
  constructor(message: string = 'Transaction has already been imported.') {
    super(message);
    this.name = 'DuplicateTransactionError';
  }
}

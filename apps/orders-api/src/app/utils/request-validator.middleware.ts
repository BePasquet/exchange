import { NextFunction, Request, Response } from 'express';
import * as joi from 'joi';

export interface RequestValidatorParams<T = unknown> {
  schema: joi.ObjectSchema<T>;
  key?: string;
  convert?: boolean;
}
export function requestValidator<T>({
  schema,
  key = 'body',
  convert = false,
}: RequestValidatorParams<T>) {
  return (req: Request, res: Response, next: NextFunction) => {
    const { error } = schema.validate(req[key as keyof Request], {
      convert,
    });

    if (!error) {
      return next();
    }

    const message = error.details.map(({ message }) => message);
    res.status(422).json({ message });
  };
}

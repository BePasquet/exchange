import * as joi from 'joi';
import { FormEvent } from 'react';

export type InputEvent = FormEvent<HTMLInputElement> & {
  target: { value: string; validity: { valid: boolean } };
};

/**
 * Checks validity of target from eventF
 * @param event emitted from target to be checked
 */
export function isTargetValid(event: InputEvent): boolean {
  return event.target.validity.valid;
}

export interface IsFormValidParams<TForm = unknown> {
  schema: joi.ObjectSchema;
  form: TForm;
}

/**
 * Validates a form against an schema, when validation pass will return true otherwise false
 * @param params -
 * - schema joi schema to test form against
 * - form to check validation
 */
export function isFormValid<TForm = unknown>({
  schema,
  form,
}: IsFormValidParams<TForm>): boolean {
  const { error } = schema.validate(form, { convert: true });
  return !error;
}

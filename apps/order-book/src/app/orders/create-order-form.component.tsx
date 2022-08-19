import {
  orderSchema,
  OrderType,
  TradeSymbol,
} from '@coindee/orders-api-interfaces';
import { ValidationError } from 'joi';
import { FormEvent, useState } from 'react';
import styled from 'styled-components';
import {
  InputEvent,
  isFormValid,
  isTargetValid,
} from '../utils/form-utilities';
import { createOrder } from './orders.service';

const pricePattern = '^[0-9]*([.][0-9]{0,2})?$';

const volumePattern = '^[0-9]*([.][0-9]{0,8})?$';

const TAB_OPTIONS = [
  {
    name: 'BUY',
    value: OrderType.Bid,
    color: '#b2d17080',
  },
  {
    name: 'SELL',
    value: OrderType.Ask,
    color: '#ee7e7e80',
  },
];

export function CreateOrderForm() {
  const [form, setForm] = useState({
    price: '',
    volume: '',
    symbol: TradeSymbol.BTC,
    type: OrderType.Bid,
  });

  const [validationError, setValidationError] =
    useState<ValidationError | null>(null);

  const [orderError, setOrderError] = useState('');

  const setInputValue = (key: keyof typeof form) => (ev: InputEvent) => {
    if (!isTargetValid(ev)) {
      return;
    }

    setForm((value) => ({
      ...value,
      [key]: ev.target.value,
    }));
  };

  const submitOrder = async (ev: FormEvent<HTMLFormElement>) => {
    ev.preventDefault();

    const { error } = orderSchema.validate(form, { convert: true });

    if (error) {
      setValidationError(error);
      return;
    }

    setValidationError(null);

    const parsedPrice = parseFloat(parseFloat(form.price).toFixed(2));
    const parsedAmount = parseFloat(parseFloat(form.volume).toFixed(8));

    try {
      await createOrder({
        price: parsedPrice,
        volume: parsedAmount,
        symbol: form.symbol,
        type: form.type,
      });

      setOrderError('');
    } catch (e: any) {
      setOrderError(
        e?.message ?? 'Sorry there was an error creating the order'
      );
    }
  };

  return (
    <form onSubmit={submitOrder}>
      <TabsContainer>
        {TAB_OPTIONS.map((option) => (
          <Tab
            key={option.value}
            style={{
              backgroundColor:
                form.type === option.value
                  ? option.color
                  : 'rgba(231, 231, 231, 0.5)',
            }}
            onClick={() =>
              setForm((value) => ({ ...value, type: option.value }))
            }
            type="button"
            data-testid={option.value}
          >
            {option.name}
          </Tab>
        ))}
      </TabsContainer>

      <ControlsContainer>
        <FormControlContainer>
          <h2>Price (USD)</h2>
          <input
            data-testid="priceInput"
            type="text"
            pattern={pricePattern}
            value={form.price}
            onInput={setInputValue('price')}
          />
        </FormControlContainer>

        <FormControlContainer>
          <h2>Amount (BTC)</h2>
          <input
            data-testid="volumeInput"
            type="text"
            pattern={volumePattern}
            value={form.volume}
            onInput={setInputValue('volume')}
          />
        </FormControlContainer>

        <SubmitButtonContainer>
          <SubmitButton
            type="submit"
            data-testid="submitOrderButton"
            disabled={!isFormValid({ schema: orderSchema, form })}
            style={{
              backgroundColor:
                form.type === OrderType.Bid ? '#b2d17080' : '#ee7e7e80',
            }}
          >
            SUBMIT {form.type === OrderType.Bid ? 'BUY' : 'SELL'} ORDER
          </SubmitButton>
        </SubmitButtonContainer>

        {validationError && (
          <ErrorMessage>
            {validationError.details.map(({ message }) => (
              <div>{message}</div>
            ))}
          </ErrorMessage>
        )}

        {orderError && <ErrorMessage>{orderError}</ErrorMessage>}
      </ControlsContainer>
    </form>
  );
}

const TabsContainer = styled.div`
  display: flex;
  flex-direction: row;
`;

const Tab = styled.button`
  width: 50%;
  padding: 12px 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  border: none;
  cursor: pointer;
  font-weight: 700;
  font-size: 14px;
  line-height: 16px;
  color: #000000;
`;

const ControlsContainer = styled.div`
  padding: 20px 26px;
`;

const FormControlContainer = styled.div`
  margin-bottom: 20px;

  h2 {
    margin: 0 0 6px 0;
    font-weight: 400;
    font-size: 14px;
    line-height: 16px;
    color: #000000;
  }

  input[type='text'] {
    width: calc(100% - 8px);
    height: 36px;
    background: rgba(255, 255, 255, 0.5);
    border: 1px solid #b4b4b4;
    padding: 0 4px;
  }
`;

const SubmitButtonContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const SubmitButton = styled.button`
  padding: 8px 16px;
  border: none;
  font-weight: 700;
  font-size: 16px;
  line-height: 18px;
  color: #000000;
  width: 90%;
  cursor: pointer;

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const ErrorMessage = styled.p`
  margin: 20px 0 0 0;
  padding: 6px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: bold;
  background-color: #fff;
  border-radius: 6px;
  color: #c97d7d;
`;

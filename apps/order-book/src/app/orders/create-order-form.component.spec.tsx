import { OrderType, TradeSymbol } from '@coindee/orders-api-interfaces';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { CreateOrderForm } from './create-order-form.component';
import { createOrder } from './orders.service';

jest.mock('./orders.service', () => ({ createOrder: jest.fn() }));

describe('CreateOrderForm', () => {
  it('Should be able to switch between buy and sell order', () => {
    render(<CreateOrderForm />);
    const sellTab = screen.getByTestId(OrderType.Ask);

    fireEvent.click(sellTab);
    const sellIdentifier = screen.getByText('SUBMIT SELL ORDER');

    expect(sellIdentifier).toBeDefined();

    const buyTab = screen.getByTestId(OrderType.Bid);
    fireEvent.click(buyTab);

    const buyIdentified = screen.getByText('SUBMIT BUY ORDER');
    expect(buyIdentified).toBeDefined();
  });

  it('Should have submit order button disabled when form is not valid', () => {
    render(<CreateOrderForm />);
    const priceInput = screen.getByTestId('priceInput');
    const volumeInput = screen.getByTestId('volumeInput');
    const submitOrderButton = screen.getByTestId('submitOrderButton');
    expect(submitOrderButton.closest('button')?.disabled).toBeTruthy();

    fireEvent.input(priceInput, { target: { value: '1000' } });
    expect(submitOrderButton.closest('button')?.disabled).toBeTruthy();

    fireEvent.input(volumeInput, { target: { value: '1' } });
    expect(submitOrderButton.closest('button')?.disabled).toBeFalsy();

    // INPUT PREVENT FROM ADDING INVALID FLOATING POINTS UNCOMMENT IF THAT FEATURE IS NOT IN PLACE
    // fireEvent.input(volumeInput, { target: { value: '0.123456789 ' } });
    // expect(submitOrderButton.closest('button')?.disabled).toBeTruthy();

    // fireEvent.input(priceInput, { target: { value: '1000.123' } });
    // expect(submitOrderButton.closest('button')?.disabled).toBeTruthy();
  });

  it('Should have submit order button enabled when form is valid', () => {
    render(<CreateOrderForm />);
    const priceInput = screen.getByTestId('priceInput');
    const volumeInput = screen.getByTestId('volumeInput');
    const submitOrderButton = screen.getByTestId('submitOrderButton');

    fireEvent.input(priceInput, { target: { value: '1000' } });
    fireEvent.input(volumeInput, { target: { value: '1' } });
    expect(submitOrderButton.closest('button')?.disabled).toBeFalsy();
  });

  it('Should be able to create an order when form is valid', () => {
    render(<CreateOrderForm />);
    const priceInput = screen.getByTestId('priceInput');
    const volumeInput = screen.getByTestId('volumeInput');
    const sellTab = screen.getByTestId(OrderType.Ask);
    fireEvent.click(sellTab);

    fireEvent.input(priceInput, { target: { value: '1000' } });
    fireEvent.input(volumeInput, { target: { value: '1' } });

    const submitOrderButton = screen.getByTestId('submitOrderButton');
    fireEvent.click(submitOrderButton);

    expect(createOrder).toHaveBeenCalledWith({
      price: 1000,
      volume: 1,
      type: OrderType.Ask,
      symbol: TradeSymbol.BTC,
    });
  });

  it('Should display error message when order fails to be created', async () => {
    render(<CreateOrderForm />);
    const message = 'Fail to create order';

    const priceInput = screen.getByTestId('priceInput');
    const volumeInput = screen.getByTestId('volumeInput');
    const sellTab = screen.getByTestId(OrderType.Ask);
    fireEvent.click(sellTab);

    (createOrder as jest.Mock).mockImplementation(() =>
      Promise.reject({ message })
    );

    fireEvent.input(priceInput, { target: { value: '1000' } });
    fireEvent.input(volumeInput, { target: { value: '1' } });
    const submitOrderButton = screen.getByTestId('submitOrderButton');
    fireEvent.click(submitOrderButton);

    await waitFor(() => screen.getByText(message));

    const error = screen.getByText(message);
    expect(error).toBeDefined();
  });
});

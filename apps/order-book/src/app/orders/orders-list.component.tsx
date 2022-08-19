import styled from 'styled-components';
import { Results } from '../shared/results.component';
import { OrderListUI } from './orders-list-ui.component';
import { useOrderBook } from './use-order-book.hook';

export function OrdersList() {
  const state = useOrderBook();

  return (
    <OrderListContainer>
      <Results {...state}>
        {state.data && <OrderListUI orderBook={state.data} />}
      </Results>
    </OrderListContainer>
  );
}

const OrderListContainer = styled.div`
  width: 400px;
`;

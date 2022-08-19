import styled from 'styled-components';
import { CreateOrderForm } from './create-order-form.component';
import { OrdersList } from './orders-list.component';

export function Orders() {
  return (
    <OrdersContainer>
      <Section>
        <OrdersList />
      </Section>
      <Section>
        <FormContainer>
          <CreateOrderForm />
        </FormContainer>
      </Section>
    </OrdersContainer>
  );
}

const OrdersContainer = styled.div`
  display: flex;
  flex-direction: row;
  flex: 1;
  align-items: center;
  justify-content: center;
  height: 100%;
`;

const Section = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex: 1;
  width: 50%;
`;

const FormContainer = styled.div`
  min-width: 300px;
  border: 0.5px solid #b4b4b4;
  background-color: #f4f4f4;
`;

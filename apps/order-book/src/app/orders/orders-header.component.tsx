import styled from 'styled-components';

export function OrdersHeader() {
  return (
    <HeaderContainer>
      <h3>Price (USD)</h3>
      <h3>Amount (BTC)</h3>
    </HeaderContainer>
  );
}

const HeaderContainer = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;

  h3 {
    margin: 0;
  }
`;

import { PropsWithChildren } from 'react';
import styled from 'styled-components';
import { ErrorMessage } from './error-message';
import { Loader } from './loader.component';

export interface QueryResult<T> {
  data: T;
  loading: boolean;
  error: string;
}

/**
 * Utility to show results based on state (loading, error and data)
 * @param params -
 * - data used by children
 * - loading flag that signifies loading state
 * - error message to display
 */
export function Results<T = unknown>({
  data,
  loading,
  error,
  children,
}: PropsWithChildren<QueryResult<T>>) {
  if (error) {
    return (
      <CenterContainer>
        <ErrorMessage>{error}</ErrorMessage>
      </CenterContainer>
    );
  }

  if (loading) {
    return (
      <CenterContainer data-testid="loaderContainer">
        <Loader />
      </CenterContainer>
    );
  }

  return data && <>{children}</>;
}

const CenterContainer = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
`;

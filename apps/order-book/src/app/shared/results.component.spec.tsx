import { render, screen } from '@testing-library/react';
import { Results } from './results.component';

describe('Results Component', () => {
  it('Should render error message when an error is present', () => {
    render(<Results data={null} error={'error'} loading={false} />);
    const component = screen.getByText('error');
    expect(component).toBeDefined();
  });

  it('Should render loading indicator when loading is true and there is no error', () => {
    render(<Results data={null} error={''} loading={true} />);
    const component = screen.getByTestId('loaderContainer');
    expect(component).toBeDefined();
  });

  it('Should render children when there is data, no error and loading is false', () => {
    const data = { id: 1 };
    render(
      <Results data={data} error={''} loading={false}>
        {data && <div data-testid="children" />}
      </Results>
    );
    const component = screen.getByTestId('children');
    expect(component).toBeDefined();
  });
});

import { render, screen } from '@testing-library/react';
import App from './App';


jest.mock('./services/api', () => ({
  __esModule: true,
  default: {},
  workersAPI: {},
  authAPI: {},
  API_BASE_URL: '',
  BACKEND_ORIGIN: ''
}));

test('renders Welcome on login page', () => {
  render(<App />);
  const welcomeElement = screen.getByText(/Welcome/i);
  expect(welcomeElement).toBeInTheDocument();
});

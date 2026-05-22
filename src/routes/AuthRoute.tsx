import { Navigate } from 'react-router-dom'

export default function AuthRoute({
  children,
}: any) {
  const token =
    localStorage.getItem('token')

  if (token) {
    return (
      <Navigate
        to="/dashboard"
        replace
      />
    )
  }

  return children
}
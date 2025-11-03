import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';

export default async function Home() {
  const cookieStore = cookies();
  const token = cookieStore.get('token')?.value;

  // If logged in, redirect to dashboard
  if (token) {
    redirect('/dashboard');
  }

  // If not logged in, redirect to login
  redirect('/login');
}

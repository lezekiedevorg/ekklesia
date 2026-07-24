import { redirect } from 'next/navigation';

// The admin landing is merged into the Command Center (single dashboard).
export default function AdminIndex() {
  redirect('/admin/super-dashboard');
}

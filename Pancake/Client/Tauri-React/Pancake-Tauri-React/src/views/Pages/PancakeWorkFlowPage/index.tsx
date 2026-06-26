import { isTauri } from '@/utils/isTauri';

export default function PancakeWorkFlowPage() {
  if (!isTauri) return null;

  return <div></div>;
}

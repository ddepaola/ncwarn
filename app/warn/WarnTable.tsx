'use client';

import { type ColumnDef } from '@tanstack/react-table';
import { format } from 'date-fns';
import DataTable from '@/components/DataTable';

interface WarnNoticeRow {
  id: number;
  employer: string;
  city: string | null;
  county: { name: string; slug: string } | null;
  industry: string | null;
  impacted: number | null;
  noticeDate: string;
  effectiveOn: string | null;
}

const columns: ColumnDef<WarnNoticeRow, unknown>[] = [
  {
    accessorKey: 'employer',
    header: 'Employer',
    cell: ({ row }) => (
      <span className="font-medium">{row.original.employer}</span>
    ),
  },
  {
    accessorKey: 'city',
    header: 'City',
  },
  {
    accessorFn: (row) => row.county?.name || '-',
    id: 'county',
    header: 'County',
  },
  {
    accessorKey: 'industry',
    header: 'Industry',
  },
  {
    accessorKey: 'impacted',
    header: 'Affected',
    cell: ({ row }) =>
      row.original.impacted?.toLocaleString() || '-',
  },
  {
    accessorKey: 'noticeDate',
    header: 'Notice Date',
    cell: ({ row }) =>
      format(new Date(row.original.noticeDate), 'MMM d, yyyy'),
  },
  {
    accessorKey: 'effectiveOn',
    header: 'Effective Date',
    cell: ({ row }) =>
      row.original.effectiveOn
        ? format(new Date(row.original.effectiveOn), 'MMM d, yyyy')
        : '-',
  },
];

interface WarnTableProps {
  data: WarnNoticeRow[];
}

export default function WarnTable({ data }: WarnTableProps) {
  return (
    <DataTable
      data={data}
      columns={columns}
      pageSize={25}
      searchable
      searchPlaceholder="Search by employer, city, industry..."
      exportable
      exportFilename="nc-warn-notices"
    />
  );
}

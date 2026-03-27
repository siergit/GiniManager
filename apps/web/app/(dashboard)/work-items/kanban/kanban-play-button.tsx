'use client';

import PlayButton from '@/components/play-button';

interface Props {
  workItemId: string;
  workItemTitle: string;
}

export default function KanbanPlayButton({ workItemId, workItemTitle }: Props) {
  return (
    <div onClick={e => e.preventDefault()} onClickCapture={e => e.stopPropagation()}>
      <PlayButton workItemId={workItemId} workItemTitle={workItemTitle} size="sm" />
    </div>
  );
}

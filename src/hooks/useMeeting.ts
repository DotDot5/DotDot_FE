// src/hooks/useMeeting.ts
import useSWR from 'swr';

import {
  getMeetingDetailWithParticipantEmails,
  getMeetingSummary,
  getMeetingRecommendations,
  MeetingDetail,
  MeetingSummaryResponse,
  RecommendationItem,
} from '@/api/meeting';

export function useMeetingDetail(meetingId?: number) {
  return useSWR<MeetingDetail & { participants: MeetingDetail['participants'] }>(
    meetingId ? ['meetingDetail', meetingId] : null,
    () => getMeetingDetailWithParticipantEmails(meetingId!)
  );
}

export function useMeetingSummary(meetingId?: number) {
  return useSWR<MeetingSummaryResponse>(meetingId ? ['meetingSummary', meetingId] : null, () =>
    getMeetingSummary(meetingId!)
  );
}

export function useMeetingRecommendations(meetingId?: number) {
  return useSWR<RecommendationItem[]>(meetingId ? ['meetingRecs', meetingId] : null, () =>
    getMeetingRecommendations(meetingId!)
  );
}

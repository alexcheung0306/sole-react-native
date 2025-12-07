import React, { useMemo } from 'react';
import { View, Text } from 'react-native';

type JobApplicationDetailProps = {
  application: any;
  roleWithSchedules: any;
};

const DetailRow = ({ label, value }: { label: string; value?: string | number | null }) => {
  if (!value && value !== 0) return null;
  return (
    <View className="flex-row items-start justify-between gap-3">
      <Text className="text-xs font-semibold uppercase tracking-wide text-white/60">{label}</Text>
      <Text className="flex-1 text-right text-sm text-white">{String(value)}</Text>
    </View>
  );
};

export function JobApplicationDetail({ application, roleWithSchedules }: JobApplicationDetailProps) {
  const process = useMemo(() => {
    const activities = roleWithSchedules?.activities ?? [];
    return activities.find((activity: any) => activity?.title === application?.applicationProcess);
  }, [application?.applicationProcess, roleWithSchedules?.activities]);

  const formattedAppliedAt = useMemo(() => {
    if (!application?.appliedAt) return null;
    const date = new Date(application.appliedAt);
    if (Number.isNaN(date.getTime())) return null;
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  }, [application?.appliedAt]);

  return (
    <View className="gap-3 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4">
      <View className="flex-row items-center justify-between">
        <Text className="text-base font-semibold text-white">Application details</Text>
        <View className="flex-row gap-2">
          <View className="rounded-full border border-emerald-400/40 bg-emerald-500/25 px-3 py-1">
            <Text className="text-xs font-semibold text-white">
              {application?.applicationProcess || 'Applied'}
            </Text>
          </View>
          <View className="rounded-full border border-blue-300/40 bg-blue-500/25 px-3 py-1">
            <Text className="text-xs font-semibold text-white">
              {application?.applicationStatus || 'Pending'}
            </Text>
          </View>
        </View>
      </View>

      <DetailRow
        label="Quote"
        value={
          application?.quotePrice
            ? `HKD ${Number(application.quotePrice).toFixed(2)}`
            : undefined
        }
      />
      {application?.otQuotePrice ? (
        <DetailRow label="OT Payment" value={`HKD ${Number(application.otQuotePrice).toFixed(2)}`} />
      ) : null}
      <DetailRow label="Skills" value={application?.skills} />
      <DetailRow label="Answer" value={application?.answer} />
      <DetailRow label="Remarks" value={application?.remarks} />
      <DetailRow label="Applied on" value={formattedAppliedAt} />

      {process?.schedules && Array.isArray(process.schedules) && process.schedules.length > 0 ? (
        <View className="mt-2 gap-2">
          <Text className="text-xs font-semibold uppercase tracking-wide text-white/60">
            {process?.title || 'Session'} schedule
          </Text>
          {process.schedules.map((schedule: any, index: number) => {
            const fromTime = schedule?.fromTime ? new Date(schedule.fromTime) : null;
            const toTime = schedule?.toTime ? new Date(schedule.toTime) : null;
            const formattedRange =
              fromTime && toTime
                ? `${fromTime.toLocaleString()} - ${toTime.toLocaleString()}`
                : 'TBC';
            return (
              <View
                key={`${schedule?.id || index}`}
                className="rounded-xl border border-white/10 bg-zinc-900/60 px-3 py-2">
                <Text className="text-sm text-white">
                  {schedule?.location ? `${schedule.location} • ${formattedRange}` : formattedRange}
                </Text>
                {schedule?.remarks ? (
                  <Text className="text-xs text-white/70">{schedule.remarks}</Text>
                ) : null}
              </View>
            );
          })}
        </View>
      ) : null}
    </View>
  );
}

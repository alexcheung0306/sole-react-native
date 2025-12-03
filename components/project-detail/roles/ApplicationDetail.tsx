import { Text, View } from "react-native";
import { 
  CheckCircle2, 
  DollarSign, 
  Calendar, 
  Briefcase, 
  FileText, 
  MessageSquare,
  Clock 
} from 'lucide-react-native';
import { getStatusColorObject } from '@/utils/get-status-color';

interface DetailRowProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  highlight?: boolean;
  statusColor?: { bg: string; text: string };
}

function DetailRow({ icon, label, value, highlight, statusColor }: DetailRowProps) {
  return (
    <View className="flex-row items-start gap-3 p-3 rounded-xl bg-zinc-800/50">
      <View className="mt-0.5">{icon}</View>
      <View className="flex-1">
        <Text className="text-xs text-white mb-1 uppercase tracking-wider">{label}</Text>
        {highlight && statusColor ? (
          <View 
            className="px-3 py-1.5 rounded-full self-start"
            style={{ backgroundColor: statusColor.bg }}>
            <Text 
              className="text-sm font-semibold uppercase tracking-wide"
              style={{ color: statusColor.text }}>
              {value}
            </Text>
          </View>
        ) : (
          <Text className="text-sm text-white font-medium">{value}</Text>
        )}
      </View>
    </View>
  );
}

export function ApplicationDetail({ applicant }: { applicant: any }) {
  const statusColors = getStatusColorObject(applicant?.applicationStatus || '');
  const processColors = getStatusColorObject(applicant?.applicationProcess || 'applied');

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const formatCurrency = (amount: number | string | undefined) => {
    if (!amount) return 'N/A';
    return `$${parseFloat(amount.toString()).toLocaleString()}`;
  };

  return (
    <View className="gap-3">
      {/* Header */}
      <View className="px-4 pt-4">
        <Text className="text-xl font-bold text-white mb-1">Application Details</Text>
        <Text className="text-sm text-white/60">
          Comprehensive overview of candidate's application
        </Text>
      </View>

      {/* Status Cards */}
      <View className="px-4 gap-2">
        <DetailRow
          icon={<CheckCircle2 size={20} color={statusColors.text} />}
          label="Application Status"
          value={applicant?.applicationStatus || 'N/A'}
          highlight={true}
          statusColor={statusColors}
        />
        
        <DetailRow
          icon={<Briefcase size={20} color={processColors.text} />}
          label="Current Process"
          value={applicant?.applicationProcess || 'Applied'}
          highlight={true}
          statusColor={processColors}
        />
      </View>

      {/* Financial Information */}
      <View className="px-4">
        <Text className="text-sm font-semibold text-white/80 mb-2 uppercase tracking-wider">
          Financial Details
        </Text>
        <View className="gap-2">
          <DetailRow
            icon={<DollarSign size={20} color="#10b981" />}
            label="Quote Price"
            value={formatCurrency(applicant?.quotePrice || applicant?.otQuotePrice)}
          />
          
          <DetailRow
            icon={<Calendar size={20} color="#3b82f6" />}
            label="Payment Basis"
            value={applicant?.paymentBasis || 'N/A'}
          />
        </View>
      </View>

      {/* Professional Information */}
      <View className="px-4">
        <Text className="text-sm font-semibold text-white/80 mb-2 uppercase tracking-wider">
          Professional Information
        </Text>
        <View className="gap-2">
          <View className="p-3 rounded-xl bg-zinc-800/50">
            <View className="flex-row items-center gap-2 mb-2">
              <Briefcase size={18} color="#f59e0b" />
              <Text className="text-xs text-white/50 uppercase tracking-wider">Skills</Text>
            </View>
            <Text className="text-sm text-white leading-5">
              {applicant?.skills || 'No skills specified'}
            </Text>
          </View>
          
          <View className="p-3 rounded-xl bg-zinc-800/50">
            <View className="flex-row items-center gap-2 mb-2">
              <MessageSquare size={18} color="#8b5cf6" />
              <Text className="text-xs text-white/50 uppercase tracking-wider">Answer</Text>
            </View>
            <Text className="text-sm text-white leading-5">
              {applicant?.answer || 'No answer provided'}
            </Text>
          </View>
        </View>
      </View>

      {/* Timeline */}
      <View className="px-4 pb-4">
        <Text className="text-sm font-semibold text-white/80 mb-2 uppercase tracking-wider">
          Timeline
        </Text>
        <View className="gap-2">
          <DetailRow
            icon={<Calendar size={20} color="#3b82f6" />}
            label="Applied Date"
            value={formatDate(applicant?.createdAt)}
          />
          
          <DetailRow
            icon={<Clock size={20} color="#f59e0b" />}
            label="Last Updated"
            value={formatDate(applicant?.updatedAt)}
          />
        </View>
      </View>
    </View>
  );
}
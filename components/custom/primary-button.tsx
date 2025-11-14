import React, { ReactNode } from 'react';
import { TouchableOpacity, Text, TouchableOpacityProps } from 'react-native';

type PrimaryButtonVariant = 'create' | 'edit' | 'primary' | 'secondary';

type PrimaryButtonProps = {
  variant?: PrimaryButtonVariant;
  disabled?: boolean;
  icon?: ReactNode;
  children: ReactNode;
  className?: string;
} & Omit<TouchableOpacityProps, 'className'>;

const variantStyles: Record<PrimaryButtonVariant, string> = {
  create: 'bg-blue-600',
  edit: 'bg-purple-600/90',
  primary: 'bg-blue-600',
  secondary: 'bg-purple-600/90',
};

export function PrimaryButton({
  variant = 'primary',
  disabled = false,
  icon,
  children,
  className = '',
  ...props
}: PrimaryButtonProps) {
  // Base styles that are always applied
  const baseStyles = `flex-row items-center justify-center gap-2 rounded-2xl 
    border border-white/10 bg-white text-black
    px-4 py-2.5`;
  const variantStyle = variantStyles[variant];
  const disabledStyle = disabled ? 'opacity-50' : '';

  // Combine all styles, allowing className to override if needed
  const combinedClassName = `${baseStyles} ${variantStyle} ${disabledStyle} ${className}`.trim();

  return (
    <TouchableOpacity
      className={combinedClassName}
      disabled={disabled}
      activeOpacity={0.85}
      {...props}>
      {icon && icon}
      {typeof children === 'string' ? (
        <Text className="text-sm font-semibold ">{children}</Text>
      ) : (
        children
      )}
    </TouchableOpacity>
  );
}

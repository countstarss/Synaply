// import React from "react";
// import {
//   DropdownMenu,
//   DropdownMenuContent,
//   DropdownMenuItem,
//   DropdownMenuTrigger,
// } from "@/components/ui/dropdown-menu";
// import { Button } from "@/components/ui/button";
// import { VisibilityType } from "@/lib/types/visibility";
// import { usePermissions } from "@/hooks/usePermissions";
// import { ChevronDown } from "lucide-react";

// interface VisibilitySelectProps {
//   value: VisibilityType;
//   onValueChange: (value: VisibilityType) => void;
//   disabled?: boolean;
//   className?: string;
// }

// export function VisibilitySelect({
//   value,
//   onValueChange,
//   disabled = false,
//   className,
// }: VisibilitySelectProps) {
//   const { availableVisibilityOptions } = usePermissions();

//   const selectedOption = availableVisibilityOptions.find(
//     (option) => option.value === value
//   );

//   return (
//     <DropdownMenu>
//       <DropdownMenuTrigger asChild>
//         <Button
//           variant="outline"
//           className={`justify-between ${className}`}
//           disabled={disabled}
//         >
//           {selectedOption && (
//             <div className="flex items-center gap-2">
//               <span>{selectedOption.icon}</span>
//               <span>{selectedOption.label}</span>
//             </div>
//           )}
//           <ChevronDown className="h-4 w-4 opacity-50" />
//         </Button>
//       </DropdownMenuTrigger>
//       <DropdownMenuContent align="start" className="w-56">
//         {availableVisibilityOptions.map((option) => (
//           <DropdownMenuItem
//             key={option.value}
//             onClick={() => onValueChange(option.value)}
//             className="cursor-pointer"
//           >
//             <div className="flex items-center gap-2">
//               <span>{option.icon}</span>
//               <div className="flex flex-col">
//                 <span className="font-medium">{option.label}</span>
//                 <span className="text-xs text-muted-foreground">
//                   {option.description}
//                 </span>
//               </div>
//             </div>
//           </DropdownMenuItem>
//         ))}
//       </DropdownMenuContent>
//     </DropdownMenu>
//   );
// }

// // 简化版本，用于只显示当前可见性状态
// interface VisibilityBadgeProps {
//   value: VisibilityType;
//   className?: string;
// }

// export function VisibilityBadge({ value, className }: VisibilityBadgeProps) {
//   const { availableVisibilityOptions } = usePermissions();
//   const option = availableVisibilityOptions.find((opt) => opt.value === value);

//   if (!option) return null;

//   return (
//     <div
//       className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-secondary text-secondary-foreground ${className}`}
//     >
//       <span>{option.icon}</span>
//       <span>{option.label}</span>
//     </div>
//   );
// }

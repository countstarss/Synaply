import {
  RiCheckboxCircleLine,
  RiRadioButtonLine,
  RiPlayCircleLine,
  RiEyeLine,
} from "react-icons/ri";

export const statusConfig = {
  TODO: {
    label: "To do",
    icon: <RiRadioButtonLine className="w-4 h-4" />,
    color: "text-gray-500 dark:text-gray-400",
  },
  IN_PROGRESS: {
    label: "In progress",
    icon: <RiPlayCircleLine className="w-4 h-4" />,
    color: "text-blue-600 dark:text-blue-400",
  },
  AMOST_DONE: {
    label: "Almost done",
    icon: <RiCheckboxCircleLine className="w-4 h-4" />,
    color: "text-orange-600 dark:text-orange-400",
  },
  BLOCKED: {
    label: "Blocked",
    icon: <RiEyeLine className="w-4 h-4" />,
    color: "text-red-600 dark:text-red-400",
  },
  DONE: {
    label: "Done",
    icon: <RiCheckboxCircleLine className="w-4 h-4" />,
    color: "text-green-600 dark:text-green-400",
  },
};

export const priorityConfig = {
  URGENT: {
    label: "Urgent",
    color:
      "bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800",
  },
  HIGH: {
    label: "High",
    color:
      "bg-orange-100 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400 border-orange-200 dark:border-orange-800",
  },
  NORMAL: {
    label: "Normal",
    color:
      "bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800",
  },
  LOW: {
    label: "Low",
    color:
      "bg-gray-100 dark:bg-gray-900/20 text-gray-700 dark:text-gray-400 border-gray-200 dark:border-gray-800",
  },
};

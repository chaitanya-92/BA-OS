import { AdmissionCalendar } from "@/components/calendar/admission-calendar";

export const metadata = {
  title: "MBA Entrance Calendar | MBA OS",
  description: "Track MBA entrance exam and B-school admission milestones with verified sources.",
};

export default function CalendarPage() {
  return <AdmissionCalendar />;
}

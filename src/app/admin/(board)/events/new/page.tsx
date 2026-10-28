import EventForm from "../../../_components/EventForm";

export const metadata = { title: "New event · Cocktail Club Board" };

export default function NewEventPage() {
  return (
    <>
      <h1 className="title mb-4">New event</h1>
      <EventForm
        eventId={null}
        initial={{
          name: "", slug: "", description: "", location: "", starts_at: "", opens_at: "",
          price: "", venmo_handle: "", zelle_info: "", cap_first: "", cap_second: "",
        }}
      />
    </>
  );
}

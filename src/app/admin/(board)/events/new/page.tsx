import EventForm from "../../../_components/EventForm";

export const metadata = { title: "New event · Cocktail Club Board" };

export default function NewEventPage() {
  return (
    <>
      <h1 className="display mb-4 text-4xl font-semibold">New event</h1>
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

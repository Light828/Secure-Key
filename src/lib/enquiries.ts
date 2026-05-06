import { supabase } from "@/integrations/supabase/client";

export interface Enquiry {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  service: string;
  message: string | null;
  status: "new" | "read" | "resolved";
  created_at: string;
}

export async function addEnquiry(
  data: Pick<Enquiry, "name" | "phone" | "email" | "service" | "message">
): Promise<Enquiry | null> {
  const { data: row, error } = await supabase
    .from("enquiries")
    .insert({
      name: data.name,
      phone: data.phone,
      email: data.email || null,
      service: data.service,
      message: data.message || null,
      status: "new",
    })
    .select()
    .single();

  if (error) {
    console.error("Failed to save enquiry:", error);
    return null;
  }
  return row as unknown as Enquiry;
}

export async function getEnquiries(): Promise<Enquiry[]> {
  const { data, error } = await supabase
    .from("enquiries")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Failed to fetch enquiries:", error);
    return [];
  }
  return (data || []) as unknown as Enquiry[];
}

export async function updateEnquiryStatus(
  id: string,
  status: Enquiry["status"]
) {
  const { error } = await supabase
    .from("enquiries")
    .update({ status })
    .eq("id", id);

  if (error) console.error("Failed to update enquiry:", error);
}

export async function deleteEnquiry(id: string) {
  const { error } = await supabase
    .from("enquiries")
    .delete()
    .eq("id", id);

  if (error) console.error("Failed to delete enquiry:", error);
}

export async function getNewCount(): Promise<number> {
  const { count, error } = await supabase
    .from("enquiries")
    .select("*", { count: "exact", head: true })
    .eq("status", "new");

  if (error) return 0;
  return count || 0;
}

import { useEffect, useState } from "react";
import { useCurrentUser } from "./useCurrentUser";

export interface CustomerInfo {
  name: string;
  email: string;
  phone: string;
}

export function useCustomerInfo() {
  const { user } = useCurrentUser();
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo>({
    name: "",
    email: "",
    phone: "",
  });

  useEffect(() => {
    if (user) {
      setCustomerInfo({
        name: user.name || "",
        email: user.email || "",
        phone: user.phoneNumber || "",
      });
    }
  }, [user]);

  return {
    customerInfo,
    setCustomerInfo,
  };
} 
import { useEffect, useState } from "react";
import { useCurrentUser } from "./useCurrentUser";

export interface CustomerInfo {
  name: string;
  email: string;
  phone: string;
  cpf?: string;
}

export function useCustomerInfo() {
  const { user } = useCurrentUser();
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo>({
    name: "",
    email: "",
    phone: "",
    cpf: "",
  });

  useEffect(() => {
    if (user) {
      setCustomerInfo({
        name: user.name || "",
        email: user.email || "",
        phone: user.phoneNumber || "",
        cpf: user.cpf || "",
      });
    }
  }, [user]);

  return {
    customerInfo,
    setCustomerInfo,
  };
} 
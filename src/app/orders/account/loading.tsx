import { MyPageSubpageLoading } from "@/components/orders/MyPageSubpageLoading";
import { RESIDENT_REGISTRATION_INFO_LOADING_LABEL } from "@/lib/account/residentRegistrationUiCopy";

export default function OrdersAccountLoading() {
  return <MyPageSubpageLoading label={RESIDENT_REGISTRATION_INFO_LOADING_LABEL} />;
}

import { RefreshCwIcon } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { useAuthUser } from "@/hooks";
import { useRequestReset, useResetPassword } from "@/services/auth";
import { Spinner } from "../ui/spinner";

export function ResetPasswordOTPForm() {
  const [otp, setOtp] = useState("");
  const { temporaryEmail, temporaryPassword } = useAuthUser();
  const { mutate: resetPassword, isPending: isResetting } = useResetPassword();
  const { mutate: resendOtp, isPending: isResending } = useRequestReset();

  const handleVerify = () => {
    if (otp.length === 6 && temporaryEmail && temporaryPassword) {
      resetPassword({
        email: temporaryEmail,
        newPassword: temporaryPassword,
        otp,
      });
    }
  };

  const handleResend = () => {
    if (temporaryEmail) {
      resendOtp({ email: temporaryEmail });
      setOtp(""); // Clear OTP input
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-1">
      <Card className="max-w-md">
        <CardHeader className="max-h-1/2">
          <CardTitle>Verify Password Reset</CardTitle>
          <CardDescription>
            Enter the verification code we sent to your email address:{" "}
            <span className="font-medium">
              {temporaryEmail || "you@example.com"}
            </span>
            .
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Field>
            <div className="flex items-center justify-between">
              <FieldLabel htmlFor="otp-verification">
                Verification code
              </FieldLabel>
              <Button
                variant="outline"
                size="xs"
                onClick={handleResend}
                disabled={isResending}
                className="cursor-pointer"
              >
                <RefreshCwIcon />
                {isResending ? "Sending..." : "Resend Code"}
              </Button>
            </div>
            <InputOTP
              maxLength={6}
              id="otp-verification"
              value={otp}
              onChange={setOtp}
              required
            >
              <InputOTPGroup className="*:data-[slot=input-otp-slot]:h-12 *:data-[slot=input-otp-slot]:w-11 *:data-[slot=input-otp-slot]:text-xl">
                <InputOTPSlot index={0} />
                <InputOTPSlot index={1} />
                <InputOTPSlot index={2} />
                <InputOTPSlot index={3} />
                <InputOTPSlot index={4} />
                <InputOTPSlot index={5} />
              </InputOTPGroup>
            </InputOTP>
            <FieldDescription>
              <Link to="#">I no longer have access to this email address.</Link>
            </FieldDescription>
          </Field>
        </CardContent>
        <CardFooter>
          <Field>
            <Button
              type="button"
              className="cursor-pointer w-full"
              onClick={handleVerify}
              disabled={otp.length !== 6 || isResetting}
            >
              {isResetting ? (
                <>
                  <Spinner className="size-5" />
                  <span>Resetting Password...</span>
                </>
              ) : (
                "Reset Password"
              )}
            </Button>
            <div className="text-muted-foreground text-sm">
              Having trouble resetting your password?{" "}
              <Link
                to="#"
                className="cursor-pointer hover:text-primary underline underline-offset-4 transition-colors"
              >
                Contact support
              </Link>
            </div>
          </Field>
        </CardFooter>
      </Card>
    </div>
  );
}

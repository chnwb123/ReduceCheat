import * as React from "react";

interface EmailTemplateProps {
  name: string;
  username: string;
  password: string;
}

export function EmailTemplate({ name, username, password }: EmailTemplateProps) {
  return (
    <div>
      <h1>Hi, {name}!</h1>
      <p>Welcome to ReduceCheat. Your account has been created successfully.</p>
      <p>Please find your login credentials below:</p>
      <p>Username: {username}</p>
      <p>Password: {password}</p>
    </div>
  );
}

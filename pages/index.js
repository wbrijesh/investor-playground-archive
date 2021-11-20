import Link from "next/link";
import { useState, useEffect } from "react";
import { supabase } from "../utils/supabaseClient";
import { Formik } from "formik";

export default function Home() {
  const [user, setUser] = useState(null);
  const [userBank, setUserBank] = useState(null);

  useEffect(() => {
    setUser(supabase.auth.user());
  }, []);

  useEffect(() => {
    user && checkUserMetaData();
  }, [user]);

  const checkUserMetaData = async () => {
    console.log("USER: ", user);
    console.log("User Metadata: ", user.app_metadata);
    const { data, error } = await supabase
      .from("bank")
      .select()
      .eq("user_id", user.id);
    if (data.length > 0) {
      setUserBank(data[0]);
    } else {
      setUserBank({ error: "no account found" });
    }
  };

  userBank && console.log("User Bank: ", userBank);

  const createBankAccount = async (abc) => {
    const { userBankData } = await supabase.from("bank").insert({
      user_id: abc.id,
      balance: 0,
    });
    window.location.reload();
  };

  const deposit = async (amount) => {
    const { data, error } = await supabase
      .from("bank")
      .update({ balance: userBank.balance + amount })
      .match({ user_id: user.id });
    window.location.reload();
  };

  return (
    <div>
      <p>Investor playground bank</p>
      <br />
      {userBank && (
        <>
          {userBank == { error: "no account found" } ? (
            <>
              <p>No bank account found!</p>
              <button
                style={{
                  border: "1px solid gray",
                  padding: "6px 12px",
                  borderRadius: "4px",
                  backgroundColor: "lightgray",
                }}
                onClick={() => {
                  user && createBankAccount(user);
                }}
              >
                Create Bank Account
              </button>
            </>
          ) : (
            <>
              <p>Bank balance: {userBank.balance}</p>
              <br />
              <Formik
                initialValues={{
                  amount: 0,
                }}
                onSubmit={async (values) => {
                  await deposit(values.amount);
                }}
              >
                {({ values, handleChange, handleSubmit }) => (
                  <form onSubmit={handleSubmit}>
                    <label> Amount: </label>
                    <input
                      type="number"
                      name="amount"
                      value={values.amount}
                      onChange={handleChange}
                    />
                    <button type="submit">Deposit</button>
                  </form>
                )}
              </Formik>
              <br />
              <Link href="/invest">
                <a style={{ color: "blue", textDecoration: "underline" }}>
                  Start Making Investments
                </a>
              </Link>
            </>
          )}
        </>
      )}
    </div>
  );
}

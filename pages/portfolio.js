import Link from "next/link";
import { useState, useEffect } from "react";
import { supabase } from "../utils/supabaseClient";
import { Formik } from "formik";

function PortfolioPage() {
  const [user, setUser] = useState(null);
  const [userBank, setUserBank] = useState(null);
  const [userInvestments, setUserInvestments] = useState(null);

  useEffect(() => {
    setUser(supabase.auth.user());
  }, []);

  useEffect(() => {
    user && getUserBankDetails();
  }, [user]);

  const getUserBankDetails = async () => {
    const { data, error } = await supabase
      .from("bank")
      .select()
      .eq("user_id", user.id);
    if (data.length > 0) {
      setUserBank(data[0]);
      checkUserInvestments();
    } else {
      setUserBank({ error: "no account found" });
    }
  };

  const checkUserInvestments = async () => {
    const { data, error } = await supabase
      .from("investment")
      .select()
      .eq("user_id", user.id);
    console.log("investment data:", data);
    if (data.length == 0) {
      setUserInvestments({ error: "no investments found" });
    } else {
      setUserInvestments(data);
    }
  };

  const sellStock = async (values) => {
    console.log("New Investment: ", values);
    const apiKey = "MB4MEJEW370B5S7B";
    const url = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${values.company}&apikey=${apiKey}`;
    const response = await fetch(url);
    const data = await response.json();
    console.log("Stock Price: ", data["Global Quote"]["05. price"]);

    userInvestments.map(async (investment) => {
      if (investment.company === values.company) {
        const { data, error } = await supabase
          .from("investment")
          .update({ amount: investment.amount - values.amount })
          .eq("user_id", user.id)
          .eq("company", values.company);
      }
    });

    const { transactionData, transactionError } = await supabase
      .from("transactions")
      .insert({
        user_id: user.id,
        amount: values.amount,
        type: values.investment_type,
        company: values.company,
        price: data["Global Quote"]["05. price"],
        charge: values.charge,
      });

    const deduct = async (amount) => {
      const { data, error } = await supabase
        .from("bank")
        .update({ balance: userBank.balance + amount })
        .match({ user_id: user.id });
      window.location.reload();
    };

    deduct(values.amount * data["Global Quote"]["05. price"] + values.charge);
  };

  return (
    <>
      {
        (user,
        userBank,
        userInvestments && (
          <>
            <p>Portfolio Page</p>
            <br />
            {userInvestments.map((investment) => {
              return (
                <>
                  <div className="flex">
                    <p>
                      {investment.company} ({investment.amount})
                    </p>
                    <br />
                    <Formik
                      initialValues={{
                        amount: 0,
                        price: 0,
                        charge: 0,
                        investment_type: "sell",
                        company: investment.company,
                      }}
                      onSubmit={(values) => {
                        sellStock(values);
                      }}
                    >
                      {({ handleSubmit, handleChange, values }) => (
                        <form onSubmit={handleSubmit}>
                          <input
                            type="number"
                            name="amount"
                            onChange={handleChange}
                            value={values.amount}
                          />
                          <button type="submit">Sell</button>
                        </form>
                      )}
                    </Formik>
                  </div>
                </>
              );
            })}
          </>
        ))
      }
    </>
  );
}

export default PortfolioPage;

import Link from "next/link";
import { useState, useEffect } from "react";
import { supabase } from "../utils/supabaseClient";
import { Formik } from "formik";

function InvestmentPage() {
  const [user, setUser] = useState(null);
  const [userBank, setUserBank] = useState(null);
  const [userInvestments, setUserInvestments] = useState(null);
  const [portfolio, setPortfolio] = useState(null);

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
      const investmentVar = [];
      data.map((investment) => {
        investmentVar.push(investment.company);
      });
      setUserInvestments(data);
      setPortfolio(investmentVar);
    }
  };

  const newInvestment = async (values) => {
    console.log("New Investment: ", values);
    const apiKey = "MB4MEJEW370B5S7B";
    const url = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${values.company}&apikey=${apiKey}`;
    const response = await fetch(url);
    const data = await response.json();
    console.log("Stock Price: ", data["Global Quote"]["05. price"]);

    if (portfolio !== null && portfolio.includes(values.company)) {
      console.log("You already invested in this company");
      userInvestments.map(async (investment) => {
        if (investment.company === values.company) {
          const { data, error } = await supabase
            .from("investment")
            .update({ amount: investment.amount + values.amount })
            .eq("user_id", user.id)
            .eq("company", values.company);
        }
      });
    } else {
      console.log("you havent yet invested in this company");
      const { submissionData, error } = await supabase
        .from("investment")
        .insert({
          user_id: user.id,
          amount: values.amount,
          company: values.company,
        });
    }

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
        .update({ balance: userBank.balance - amount })
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
            <p>Investment Page</p>
            <button onClick={() => newAppleStock()}>New Apple Stock</button>
            <br />
            {userBank.balance < 1 ? (
              <>
                <p style={{ color: "red" }}>Insufficient Balance</p>

                <Link href="/">
                  <a style={{ color: "blue", textDecoration: "underline" }}>
                    Add money in bank
                  </a>
                </Link>
              </>
            ) : null}
            <br />
            {userInvestments === { error: "no investments found" } ? (
              <p style={{ color: "gray" }}>No Investments made yet</p>
            ) : (
              <Link href="/portfolio">
                <a style={{ color: "blue", textDecoration: "underline" }}>
                  My portfolio
                </a>
              </Link>
            )}
            <br />
            <br />
            <Formik
              initialValues={{
                amount: 0,
                price: 0,
                charge: 0,
                investment_type: "buy",
                dateTime: new Date().toISOString(),
                company: "",
              }}
              onSubmit={(values) => {
                newInvestment(values);
              }}
            >
              {({
                values,
                errors,
                touched,
                handleChange,
                handleBlur,
                handleSubmit,
                isSubmitting,
              }) => (
                <form onSubmit={handleSubmit}>
                  <div>
                    <label htmlFor="amount">Amount</label>
                    <input
                      type="number"
                      name="amount"
                      id="amount"
                      onChange={handleChange}
                      onBlur={handleBlur}
                      value={values.amount}
                    />
                    {errors.amount && touched.amount && (
                      <div style={{ color: "red", marginTop: ".5rem" }}>
                        {errors.amount}
                      </div>
                    )}
                  </div>
                  <div>
                    <label htmlFor="company">Company</label>
                    <input
                      type="text"
                      name="company"
                      id="company"
                      onChange={handleChange}
                      onBlur={handleBlur}
                      value={values.company}
                    />
                    {errors.company && touched.company && (
                      <div style={{ color: "red", marginTop: ".5rem" }}>
                        {errors.company}
                      </div>
                    )}
                  </div>
                  <button type="submit" disabled={isSubmitting}>
                    Invest
                  </button>
                </form>
              )}
            </Formik>
          </>
        ))
      }
    </>
  );
}

export default InvestmentPage;

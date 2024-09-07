import React, { useEffect, useState } from 'react';

const ReserveDetails = () => {
  const [rcoinAmount, setRcoinAmount] = useState(null);
  const [totalINRCValue, setTotalINRCValue] = useState(null);
  const [totalMATICValue, setTotalMATICValue] = useState(null);
  const [totalLINKValue, setTotalLINKValue] = useState(null);
  const [totalINRCAmount, setTotalINRCAmount] = useState(null);
  const [totalMATICAmount, setTotalMATICAmount] = useState(null);
  const [totalLINKAmount, setTotalLINKAmount] = useState(null);
  const [INRCPrice, setINRCPrice] = useState(null);
  const [MaticPrice, setMaticPrice] = useState(null);
  const [LINKPrice, setLINKPrice] = useState(null);
  const [Totalvalue, setTotalValue] = useState(null);
  const [error, setError] = useState(null);

  const fetchCollateralData = async () => {
    try {
      const response = await fetch('http://localhost:3000/api/reserve-details', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      const data = await response.json();
      setTotalINRCAmount(data.INRCAmount);
      setTotalMATICAmount(data.MATICAmount);
      setTotalLINKAmount(data.LINKAmount);
      setRcoinAmount(data.RCOINAmount);
      setTotalINRCValue(data.totalINRCValue);
      setTotalMATICValue(data.totalMATICValue);
      setTotalLINKValue(data.totalLINKValue);
      setINRCPrice(data.curentINRCprice);
      setMaticPrice(data.curentMATICprice);
      setLINKPrice(data.curentLINKprice);
      setTotalValue(data.totalINRCValue + data.totalMATICValue + data.totalLINKValue );
    } catch (error) {
      console.error('Error fetching collateral data:', error);
      setError('An error occurred while fetching data');
    }
  };

  const runReserveManager = async () => {
    try {
      const response = await fetch('http://localhost:3000/api/run-reserve-manager', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        throw new Error('Failed to run Reserve Manager');
      }

      alert('Reserve Manager executed successfully!');
      fetchCollateralData(); // Refresh data after running the manager
    } catch (error) {
      console.error('Error running Reserve Manager:', error);
      alert('An error occurred while running Reserve Manager');
    }
  };

  useEffect(() => {
    fetchCollateralData();
  }, []);

  return (
    <div className='container'>
      <h2>Reserve Details</h2>
      {error && <p className="error">{error}</p>}
      <table className='value-container'>
        <tr>
            <td></td>
            <td><h2>Amount</h2></td>
            <td><h2>Price</h2></td>
            <td><h2>Value</h2></td>
        </tr>
        <tr>
            <td><p className='title'> INRC</p></td>
            <td>   
                <p><span>{totalINRCAmount !== null ? Number(totalINRCAmount).toFixed(3) : 'Loading...'}</span></p>
            </td>
            <td>
                <p><span>{INRCPrice !== null ? Number(INRCPrice).toFixed(3) : 'Loading...'}</span></p>
            </td>
            <td>
                <p><span>{totalINRCValue !== null ? Number(totalINRCValue).toFixed(3) : 'Loading...'}</span></p>
            </td>
        </tr>
        <tr>
            <td><p className='title'> MATIC</p></td>
            <td>   
                <p><span>{totalMATICAmount !== null ? Number(totalMATICAmount).toFixed(3) : 'Loading...'}</span></p>
            </td>
            <td>
                <p><span>{MaticPrice !== null ?  Number(MaticPrice).toFixed(3) : 'Loading...'}</span></p>        
            </td>
            <td>
                <p><span>{totalMATICValue !== null ? Number(totalMATICValue).toFixed(3) : 'Loading...'}</span></p>
            </td>
        </tr>
        <tr>
            <td><p className='title'> LINK</p></td>
            <td>   
                <p><span>{totalLINKAmount !== null ? Number(totalLINKAmount).toFixed(3) : 'Loading...'}</span></p>
            </td>
            <td>
                <p><span>{LINKPrice !== null ? Number(LINKPrice).toFixed(3) : 'Loading...'}</span></p>
            </td>
            <td>
                <p><span>{totalLINKValue !== null ? Number(totalLINKValue).toFixed(3) : 'Loading...'}</span></p>
            </td>
        </tr>
        <tr>
            <td></td>
            <td></td>
            <td><p className='title'>Total value</p> </td>
            <td>
                <p><span>{Totalvalue !== null ? Number(Totalvalue).toFixed(3) : 'Loading...'}</span></p>
            </td>
        </tr>
        <tr>
            <td></td>
            <td></td>
            <td><p className='title'>RCoin Amount</p> </td>
            <td>
                <p><span>{rcoinAmount !== null ? Number(rcoinAmount).toFixed(3) : 'Loading...'}</span></p>
            </td>
        </tr>
      </table>
      <button onClick={runReserveManager}>Run Reserve Manager</button>
    </div>
  );
};

export default ReserveDetails;

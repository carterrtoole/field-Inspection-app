import { useState } from "react";

function Question({ text }) {
  return (
    <div style={{ marginBottom: "15px" }}>
      <label
        style={{
          display: "block",
          marginBottom: "5px",
          fontWeight: "bold",
        }}
      >
        {text}
      </label>

      <select
        style={{
          width: "100%",
          padding: "8px",
        }}
      >
        <option value="">Select Response</option>
        <option value="yes">Yes</option>
        <option value="no">No</option>
        <option value="na">N/A</option>
      </select>
    </div>
  );
}

function App() {
  const [site, setSite] = useState("");
  const [asset, setAsset] = useState("");
  const [comments, setComments] = useState("");
  const [operational, setOperational] = useState(false);
  const [issueIdentified, setIssueIdentified] = useState(false);
  const [inspectionType, setInspectionType] = useState("");
``
const forms = {
  form1: [
    "Question 1",
    "Question 2",
    "Question 3",
  ],

  form2: [
    "Question 1",
    "Question 2",
    "Question 3",
    "Question 4",
  ],

  form3: [
    "Question 1",
    "Question 2",
  ],

  prejob: [
    "Conflicting jobs in vicinity?",
    "Working near mobile equipment?",
    "Tools and equipment inspected?",
    "Defective tools tagged and locked out?",
    "Exposure to hazardous energy/materials?",
    "Risk from moving objects or sharp edges?",
    "Risk of caught-between hazards?",
    "Slip, trip, or fall hazards?",
    "Lifting or strain hazards?",
    "All job locations reviewed?",
    "Fire hazards associated with task?",
    "MSDS available?",
    "Environmental controls required?",
    "Environmental aspects reviewed?",
    "Rescue/environmental response plan required?",
    "Additional PPE required?",
    "Journey management requirements reviewed?"
  ]
};

  return (
    <div
      style={{
        maxWidth: "500px",
        margin: "40px auto",
        padding: "20px",
        fontFamily: "Arial",
      }}
    >
      <h1
        style={{
          fontSize: "36px",
          textAlign: "center",
          color: "#0078D4",
        }}

      >
          Form Management App
      </h1>
        
      <h2>New Inspection</h2>

      <input
        type="text"
        placeholder="Site"
        value={site}
        onChange={(e) => setSite(e.target.value)}
        style={{
          width: "100%",
          padding: "10px",
          marginBottom: "10px",
        }}
      />

      <select
        value={asset}
        onChange={(e) => setAsset(e.target.value)}
        style={{
          width: "100%",
          padding: "10px",
          marginBottom: "10px",
        }}
      >
        <option value="">Select Asset</option>
        <option value="Asset 001">Asset 001</option>
        <option value="Asset 002">Asset 002</option>
        <option value="Asset 003">Asset 003</option>
      
      </select>


      <select
        value={inspectionType}
        onChange={(e) => setInspectionType(e.target.value)}
        style={{
          width: "100%",
          padding: "10px",
          marginBottom: "10px",
        }}
      >
        <option value="">Select Inspection Type</option>
        <option value="form1">Type 1</option>
        <option value="form2">Type 2</option>
        <option value="form3">Type 3</option>
        <option value= "prejob"> Pre-Job Task Hazard Analysis</option>
      </select> 


      <br />

     <h3
        style={{
          color: "#F58220",
          fontWeight: "bold",
        }}
      >
        Checklist
      </h3>

      {inspectionType &&
        forms[inspectionType]?.map((question) => (
          <Question
            key={question}
            text={question}
          />
        ))}

      <br />

      <h4> COMMENTS</h4>
      <textarea
        placeholder="Comments"
        value={comments}
        onChange={(e) => setComments(e.target.value)}
        style={{
          width: "100%",
          height: "100px",
          padding: "10px",
        }}
      />

      <h3> Attatchements</h3>

      <input type="file" multiple />

      <input
        type="text"
        placeholder="Inspector Name"
        style={{
          width: "100%",
          padding: "10px",
          marginBottom: "10px",
        }}
      />  

            <select
        style={{
          width: "100%",
          padding: "10px",
          marginBottom: "10px",
        }}

        
      >
        <option value="">Select Inspection Status</option>
        <option value="form1">Pass</option>
        <option value="form2">Pass with Notes</option>
        <option value="form3">Fail</option>
      </select> 



      <input
        type="date"
        style={{
          width: "100%",
          padding: "10px",
          marginBottom: "10px",
        }}
      />  

      <input 
        type = "text"
        placeholder="Inspector Signature"
      />

      <br />
      <br />

      <button
        style={{
          padding: "10px 20px",
          backgroundColor: "#0078D4",
          color: "white",
          border: "none",
          borderRadius: "5px",
        }}
      >
        Submit Inspection
      </button>

      <hr />

      <h3>Review</h3>

      <p><strong>Site:</strong> {site}</p>
      <p><strong>Asset:</strong> {asset}</p>
      <p><strong>Operational:</strong> {operational ? "Yes" : "No"}</p>
      <p><strong>Comments:</strong> {comments}</p>
    </div>
  );
}

export default App;
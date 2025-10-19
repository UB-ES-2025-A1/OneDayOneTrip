import type { ReactNode } from "react";
import StyleSheet from "react"

export default function Footer({ children }: { children?: ReactNode }) {
  return (
    <footer style={{marginTop: '50px',backgroundColor:'#2e492e', height: '200px', color: '#fff', paddingLeft: '30px', paddingTop:'1px'}} className="bg-gray-800 text-white py-4 mt-8">
      <div style={{height: '3px', backgroundColor: '#2e492e'}}></div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gridGap: 20 }}>
        <div className="container mx-auto text-center">
            <h2>OneDayOneTrip</h2>
        <p>&copy; {new Date().getFullYear()} OneDayOneTrip.All rights reserved.</p>
        {children}
      </div>
        <div>
            <h2>Contacte</h2>
            <p> <a style={{color: '#fff', textDecoration: 'none'}} href="mailto:help@onedayonetrip.com">help@onedayonetrip.com</a></p>
            <p><a  style={{color: '#fff', textDecoration: 'none'}} href="tel:+34 123 456 789">+34 123 456 789</a></p>
        </div>
      </div>
      
    </footer>
  );
}

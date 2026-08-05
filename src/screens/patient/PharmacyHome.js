import ServiceScreenTemplate from './ServiceScreenTemplate';
const PharmacyHome = (props) => (
    <ServiceScreenTemplate 
        title="Pharmacy" 
        collectionName="pharmacy" 
        iconName="basket-outline" 
        {...props} 
    />
);
export default PharmacyHome;
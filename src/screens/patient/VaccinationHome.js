import ServiceScreenTemplate from './ServiceScreenTemplate';
const VaccinationHome = (props) => (
    <ServiceScreenTemplate 
        title="Vaccination" 
        collectionName="vaccination" // Firestore collection name
        iconName="shield-checkmark" 
        {...props} 
    />
);
export default VaccinationHome;
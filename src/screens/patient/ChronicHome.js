import ServiceScreenTemplate from './ServiceScreenTemplate';
const ChronicHome = (props) => (
    <ServiceScreenTemplate 
        title="Chronic Illness" 
        collectionName="chronicIllness" 
        iconName="heart-circle-outline" 
        {...props} 
    />
);
export default ChronicHome;
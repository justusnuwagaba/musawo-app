import ServiceScreenTemplate from './ServiceScreenTemplate';
const ScreeningHome = (props) => (
    <ServiceScreenTemplate 
        title="Health Screening" 
        collectionName="healthScreening" 
        iconName="medical-outline" 
        {...props} 
    />
);
export default ScreeningHome;